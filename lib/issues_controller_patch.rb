module IssueHotButtons
  module IssuesControllerPatch     

    def self.included(base)
      base.send(:helper, :sort)
      base.send(:include, SortHelper)
      base.send(:include, InstanceMethods)
      base.class_eval do
        before_filter :nearby_issues, :only => :show
        before_filter :store_last_seen_project, :only => :index
      end
    end
    
    module InstanceMethods
      def nearby_issues
        restore_project = nil
        unless session[:last_seen_project].nil?
          last_seen_project = Project.find(session[:last_seen_project])
          if @project.self_and_ancestors.include? last_seen_project
            restore_project = @project
            @project = last_seen_project
          end
        end

        session['issues_show_sort'] = session['issues_index_sort'] unless session['issues_index_sort'].nil?
        retrieve_query
        sort_init(@query.sort_criteria.empty? ? [['id', 'desc']] : @query.sort_criteria)
        sort_update(@query.sortable_columns)

        @nearby_issues = [];
        if @query.valid?
          @issues = @query.issues(
            :include => [:assigned_to, :tracker, :priority, :category, :fixed_version],
            :order => sort_clause
          )
          @issues.uniq!
          @issues.each {|issue| @nearby_issues.push issue.id}
        end

        @project = restore_project unless restore_project.nil?
      end

      def store_last_seen_project
        session[:last_seen_project] = @project.id unless @project.nil?
      end
    end
  end
end